document.addEventListener("DOMContentLoaded", () => {
    const optionItems = document.querySelectorAll(".option-items");
    const bidButton = document.querySelector("button");

    let selectedTrucks = [];

    optionItems.forEach(item => {
        item.addEventListener("click", () => {
            item.classList.toggle("selected");
            const truckType = item.querySelector("h1").textContent;

            if (selectedTrucks.includes(truckType)) {
                selectedTrucks = selectedTrucks.filter(t => t !== truckType);
            } else {
                selectedTrucks.push(truckType);
            }
        });
    });

    bidButton.addEventListener("click", () => {
        if (selectedTrucks.length === 0) {
            alert("Please select at least one truck.");
            return;
        }
        
        sessionStorage.setItem("selectedTrucks", JSON.stringify(selectedTrucks));

        window.location.href = "../vendor/vendorPage.html";
    });
});
